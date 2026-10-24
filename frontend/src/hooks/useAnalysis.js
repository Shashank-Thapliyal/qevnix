import { useEffect, useState } from "react";
import { getAnalysis } from "../lib/api";

export function useAnalysis(deliveryDate, cutoffLocal) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    getAnalysis({
      deliveryDate,
      decisionCutoff: `${cutoffLocal}:00Z`, // inputs are treated as UTC
    })
      .then((data) => !cancelled && setState({ data, loading: false, error: null }))
      .catch((e) => !cancelled && setState({ data: null, loading: false, error: e.message }));

    return () => {
      cancelled = true;
    };
  }, [deliveryDate, cutoffLocal]);

  return state;
}