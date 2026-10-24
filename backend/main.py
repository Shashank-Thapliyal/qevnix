import math
import os
from datetime import date, datetime, timedelta, timezone
import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

load_dotenv()

app = FastAPI(title="Wind Forecast API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

BASE_URL = os.getenv(
    "ELEXON_BASE_URL",
    "https://data.elexon.co.uk/bmrs/api/v1/datasets",
).rstrip("/")


def response_envelope(
    *,
    data: dict | None = None,
    error: dict | None = None,
) -> dict:
    return {
        "success": error is None,
        "data": data,
        "error": error,
    }


def normalize_timestamp(value: str) -> datetime:
    timestamp = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)
    return timestamp.astimezone(timezone.utc)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content=response_envelope(
            error={"code": "REQUEST_FAILED", "message": str(exc.detail)}
        ),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
):
    return JSONResponse(
        status_code=422,
        content=response_envelope(
            error={"code": "VALIDATION_FAILED", "message": str(exc.errors())}
        ),
    )


@app.exception_handler(Exception)
async def unexpected_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content=response_envelope(
            error={
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected server error occurred",
            }
        ),
    )


def fetch_elexon(dataset: str, params: dict) -> list[dict]:
    try:
        res = requests.get(f"{BASE_URL}/{dataset}/stream", params=params, timeout=30)
        res.raise_for_status()
        data = res.json()
        return data.get("data", []) if isinstance(data, dict) else data
    except Exception as exception:
        raise HTTPException(
            status_code=502,
            detail=f"Elexon {dataset} API error: {str(exception)}",
        )

@app.get("/health")
def health_check():
    return response_envelope(data={"status": "ok"})

@app.get("/api/analysis")
def get_analysis(
    delivery_date: date = Query(default=date(2026, 1, 15)),
    decision_cutoff: datetime = Query(
        ...,
        description=(
            "UTC or timezone-aware ISO 8601 timestamp defining when "
            "the purchasing decision is made"
        ),
    ),
):
    if decision_cutoff.tzinfo is None:
        raise HTTPException(
            status_code=400,
            detail="decision_cutoff must include a timezone",
        )

    # The scope is decisions made in January 2026, not delivery dates.
    if (decision_cutoff.year, decision_cutoff.month) != (2026, 1):
        raise HTTPException(status_code=400, detail="Only January 2026 is supported")

    cutoff_dt = decision_cutoff.astimezone(timezone.utc)

    delivery_start = datetime.combine(
        delivery_date, datetime.min.time(), tzinfo=timezone.utc
    )
    if cutoff_dt >= delivery_start:
        raise HTTPException(
        status_code=400,
        detail="Decision cutoff must be before delivery starts",
    )
    delivery_end = delivery_start + timedelta(days=1)

    # Fetch Data
    actuals = fetch_elexon("FUELHH", {
        "settlementDateFrom": delivery_date.isoformat(),
        "settlementDateTo": delivery_date.isoformat(),
        "fuelType": "WIND"
    })
    
    forecasts = fetch_elexon("WINDFOR", {
        "publishDateTimeFrom": (cutoff_dt - timedelta(days=2)).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "publishDateTimeTo": cutoff_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    })

    # Match intervals by their normalized UTC timestamp.
    actuals_by_timestamp = {
        normalize_timestamp(a["startTime"]): a["generation"]
        for a in actuals
        if a.get("startTime") and a.get("generation") is not None
    }

    # Filter forecasts for intervals that exist in actuals
    eligible_forecasts = []
    for forecast_record in forecasts:
        if (
            not forecast_record.get("startTime")
            or not forecast_record.get("publishTime")
        ):
            continue

        target_timestamp = normalize_timestamp(forecast_record["startTime"])
        if (
            target_timestamp not in actuals_by_timestamp
            or forecast_record.get("generation") is None
        ):
            continue

        published_timestamp = normalize_timestamp(forecast_record["publishTime"])
        if not (delivery_start <= target_timestamp < delivery_end):
            continue
        if published_timestamp > cutoff_dt:
            continue

        eligible_forecasts.append(forecast_record)
    
    # Sort by publish time ascending. By converting to a dict next, 
    # the latest publish time naturally overwrites earlier ones for the same startTime.
    eligible_forecasts.sort(
        key=lambda forecast_record: normalize_timestamp(
            forecast_record["publishTime"]
        )
    )
    latest_forecasts = {
        normalize_timestamp(forecast_record["startTime"]): {
            "startTime": forecast_record["startTime"],
            "forecast": forecast_record["generation"],
            "publishTime": forecast_record["publishTime"],
        }
        for forecast_record in eligible_forecasts
    }

    # Build final matched points array
    points = []
    for timestamp, forecast_record in latest_forecasts.items():
        predicted_generation = float(forecast_record["forecast"])
        actual_generation = float(actuals_by_timestamp[timestamp])
        points.append({
            "startTime": forecast_record["startTime"],
            "publishTime": forecast_record["publishTime"],
            "forecast": predicted_generation,
            "actual": actual_generation,
            "error": predicted_generation - actual_generation,
        })

    if not points:
        return response_envelope(
            data={
                "deliveryDate": delivery_date.isoformat(),
                "decisionCutoff": cutoff_dt.isoformat(),
                "matchedIntervals": 0,
                "points": [],
                "metrics": None,
                "message": "No matching forecast and actual records were found.",
            },
        )

    # Calculate metrics
    errors = [point["error"] for point in points]
    matched_intervals = len(errors)

    return response_envelope(
        data={
            "deliveryDate": delivery_date.isoformat(),
            "decisionCutoff": cutoff_dt.isoformat(),
            "matchedIntervals": matched_intervals,
            "points": points,
            "metrics": {
                "mae": round(
                    sum(abs(error) for error in errors) / matched_intervals, 2
                ),
                "rmse": round(
                    math.sqrt(
                        sum(error**2 for error in errors) / matched_intervals
                    ),
                    2,
                ),
                "bias": round(
                    sum(errors) / matched_intervals,
                    2,
                ),
            },
        },
    )