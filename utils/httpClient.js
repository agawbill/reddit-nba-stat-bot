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
    // return new Promise((resolve, reject) => {
    //   const url = urlConstructer(this.baseUrl, params);
    //   https.get(url, (res) => {
    //     if (res.statusCode !== 200) {
    //       let error = `Did not get an OK from the server. Code: ${res.statusCode}`;
    //       console.error(error);
    //       res.resume();
    //       return reject(error);
    //     }
    //     let data = "";
    //     res.on("data", (chunk) => {
    //       data += chunk;
    //     });
    //     res.on("close", () => {
    //       console.log("Retrieved all data");
    //       // console.log(JSON.parse(data));
    //       return resolve(JSON.parse(data));
    //     });
    //   });
    // });
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
