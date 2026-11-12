import { useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  SARIA_AI_ACTION_EVENT,
  SARIA_AI_ACTION_RESULT_EVENT,
} from "../utils/sariaAIAction";

/**
 * Stages Saria AI form values into an existing add/edit form.
 *
 * The form stays fully in charge: `apply` receives only the staged fields and
 * decides how to merge them, and the user still presses Save themselves.
 *
 * @param {object}   options
 * @param {string}   options.module  Module key from SARIA_AI_MODULES.
 * @param {Function} options.apply   (fields, action) => response text|null
 * @param {boolean}  options.ready   True once the form's lookup data is loaded.
 */
export const useSariaAIPrefill = ({ module, apply, ready = true }) => {
  const location = useLocation();
  const handledRouteAction = useRef(false);

  const runApply = useCallback(
    (action) => {
      try {
        return apply?.(action.fields || {}, action) ?? null;
      } catch (error) {
        console.error("Saria AI prefill failed:", error);
        return "I could not prepare that form. Please try again or fill it in manually.";
      }
    },
    [apply],
  );

  useEffect(() => {
    if (!ready || handledRouteAction.current) return;

    const action = location.state?.aiAction;
    if (!action || action.module !== module || !action.fields) return;

    handledRouteAction.current = true;
    const response = runApply(action);

    window.dispatchEvent(
      new CustomEvent(SARIA_AI_ACTION_RESULT_EVENT, {
        detail: { content: response },
      }),
    );
  }, [location.state, module, ready, runApply]);

  useEffect(() => {
    const handleAction = (event) => {
      const action = event.detail?.action;
      if (!action || action.module !== module) return;

      event.preventDefault();
      const response = runApply(action);
      event.detail.response = response;
      event.detail.respond?.(response);
    };

    window.addEventListener(SARIA_AI_ACTION_EVENT, handleAction);
    return () => window.removeEventListener(SARIA_AI_ACTION_EVENT, handleAction);
  }, [module, runApply]);
};

export default useSariaAIPrefill;
