/**
 * Extract a human-readable error message from an API error response.
 * Specifically handles FastAPI/Pydantic validation error objects.
 */
export const getErrorMessage = (error, defaultMsg = 'An error occurred') => {
    if (!error) return defaultMsg;

    // Handle string errors
    if (typeof error === 'string') return error;

    // Handle network / timeout failures where no response is available
    if (error.code === 'ECONNABORTED') {
        return 'The request timed out. Please check that the backend server is running and try again.';
    }

    if (error.request && !error.response) {
        return 'Could not reach the backend server. Please make sure the backend is running.';
    }

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
