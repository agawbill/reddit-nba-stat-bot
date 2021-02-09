import axios from "axios";

class HttpClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async get(params) {
    try {
      const url = urlConstructer(this.baseUrl, params);
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error(error);
    }
  }
}

const urlConstructer = (baseUrl, params) => {
  let urlString = baseUrl;

  if (Array.isArray(params)) {
    params.forEach((param, index) => {
      if (param.value) {
        let urlParam =
          index === 0
            ? `?${param.type}=${param.value}`
            : `&${param.type}=${param.value}`;
        urlString += urlParam;
      }
    });
  } else {
    urlString += `/${params}`;
  }

  return urlString;
};

export default HttpClient;
