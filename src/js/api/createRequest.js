const createRequest = async (url, options) => {
  // fetch;  
  const fetchOptions = {
    method: options.method || 'GET',
    headers: { ...options.headers },
  };
  if (options.body) {
    if (options.body instanceof FormData) {
      fetchOptions.body = options.body;
    } else {
      fetchOptions.headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(options.body)
    }
  }
  const res = await fetch(url, fetchOptions)

  // проверяет response.ok;
  if (!res.ok) {
    const data = await res.json();
    const error = new Error(data.message);
    error.status = res.status;
    throw error;
  } 
  return res.json();
};

export default createRequest;
