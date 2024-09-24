import * as proto from "@code-blog/api";
import { rpc } from "../service";

const url = () => `/data`;
const service = proto.DataService.methods;

const upload = async (req: proto.DataUploadRequest) => {
  return rpc(url(), '/upload', service.upload, req);
} 

const getFull = async (req: proto.DataGetFullRequest) => {
  return rpc(url(), '/get/post', service.getFullPost, req);
};

const getPreview = async (req: proto.DataGetPreviewRequest) => {
  return rpc(url(), '/get/post-preview', service.getPreviewPost, req);
};

// New get all blog posts
const getAllPosts = async (req: proto.DataGetAllPostsRequest) => {
  const request = new proto.DataGetAllPostsRequest(req);
  const response = await rpc(url(), '/get/all-posts', service.getAllPosts, request);
  console.log('getAllPosts response:', response);
  return response;
};

export {
  upload,
  getPreview,
  getFull,
  getAllPosts,
};