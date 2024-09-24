<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getAllPosts } from '../../services/endpoints/data';
import type { DataPost, DataGetAllPostsRequest, DataGetAllPostsResponse } from '@code-pennypost/api';

const posts = ref<DataPost[]>([]);
const error = ref<string | null>(null);

const fetchPosts = async () => {
  try {
    console.log("Fetching all blog posts...");
    const request: DataGetAllPostsRequest = {
      page: 0,
      pageSize: 12,
      tag: '',
      authorId: '',
      sortBy: '',
      ascending: true
    };
    const response: DataGetAllPostsResponse = await getAllPosts(request);
    console.log("Fetched posts:", response);
    posts.value = response.posts;
  } catch (err) {
    console.error('Error fetching posts:', err);
    error.value = err.message || 'An error occurred while fetching posts';
  }
};

onMounted(fetchPosts);
</script>

<template>
  <div class="container mx-auto px-4">
    <h1 class="text-4xl font-bold text-center my-8">Blog Posts</h1>
    <div v-if="error" class="text-red-500 text-center">{{ error }}</div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      <div v-for="post in posts" :key="post.id" class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="p-6">
          <h3 class="text-xl font-semibold text-[#07204E] mb-2">{{ post.title }}</h3>
          <p class="text-gray-600 mb-4">{{ post.contentPreview }}</p>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-500">{{ new Date(post.createdAt).toLocaleDateString() }}</span>
            <router-link :to="`/post/${post.slug}`" class="text-[#34AA4E] hover:underline">Read more</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 1200px;
}
</style>