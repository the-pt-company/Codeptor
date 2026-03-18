/**
 * Extract a human-readable error message from an API error response.
 * Specifically handles FastAPI/Pydantic validation error objects.
 */
export const getErrorMessage = (error, defaultMsg = 'An error occurred') => {
    if (!error) return defaultMsg;

    // Handle string errors
    if (typeof error === 'string') return error;

    // Handle Axios error objects
    if (error.response?.data) {
        const detail = error.response.data.detail;

        if (typeof detail === 'string') return detail;

        if (Array.isArray(detail)) {
            // Handle Pydantic validation errors: [{loc: [...], msg: "...", type: "..."}]
            return detail
                .map((err) => {
                    const field = err.loc ? err.loc[err.loc.length - 1] : '';
                    return field ? `${field}: ${err.msg}` : err.msg;
                })
                .join(', ');
        }
    }

    return error.message || defaultMsg;
};
