// ./packages/frontend/src/services/endpoints/post.ts

import * as proto from "../../../../api";
import { rpc } from "../service";

const url = () => `/post`;
const service = proto.PostService.methods;

const create = async (req: proto.PostCreateRequest) => {
  const request = new proto.PostCreateRequest(req);
  return rpc(url(), '/create', service.create, request);
};

const get = async (req: proto.PostGetRequest) => {
  const request = new proto.PostGetRequest(req);
  return rpc(url(), '/get', service.get, request);
};

const getPaginated = async (req: proto.PostGetPaginatedRequest) => {
  const request = new proto.PostGetPaginatedRequest(req);
  const response = await rpc(url(), '/get-paginated', service.getPaginated, request);
  console.log('getPaginated response:', response);
  return response;
};

export {
    create,
    get,
    getPaginated,
};