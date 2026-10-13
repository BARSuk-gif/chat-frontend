import createRequest from "./createRequest";

export default class Entity {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }
  
  list() {
    return createRequest(new URL ('/users', this.baseUrl), {
      method: 'GET',
    })
  }

  get(id) {
    return createRequest(new URL(`/users/${id}`, this.baseUrl), {
      method: 'GET',
    })
  }

  create(data) {
    return createRequest(new URL('/users', this.baseUrl), {
      method: 'POST', 
      body: data,
    });
  }

  update(id, data) {
    return createRequest(new URL(`/users/${id}`, this.baseUrl), {
      method: 'PUT',
      body: data,
    });
  }

  delete(id) {
    return createRequest(new URL(`/users/${id}`, this.baseUrl), {
      method: "DELETE",
    });
  }
}
