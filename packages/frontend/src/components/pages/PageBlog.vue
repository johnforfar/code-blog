<script setup lang="ts">
// ./packages/frontend/src/components/pages/PageBlog.vue
import { ref, onMounted } from 'vue';
import { getPaginated } from '../../services/endpoints/post';
import type { Post, PostGetPaginatedRequest, PostGetPaginatedResponse } from '@code-blog/api';
import { PostGetPaginatedResponse_Result } from '@code-blog/api';

const posts = ref<Post[]>([]);
const error = ref<string | null>(null);

const fetchPosts = async () => {
  try {
    console.log("Fetching paginated blog posts...");
    const request: PostGetPaginatedRequest = {
      ownerId: '',
      page: 1,
      pageSize: 12
    };
    console.log("Request object:", request);
    
    const response = await getPaginated(request);
    console.log("Raw response:", response);
    
    if (response.result === PostGetPaginatedResponse_Result.OK) {
      console.log("Fetched posts:", response.posts);
      posts.value = response.posts || [];
      console.log("Updated posts:", posts.value);
    } else {
      console.error("Error in response:", response.result);
      error.value = "Failed to fetch posts";
    }
  } catch (err) {
    console.error('Error fetching posts:', err);
    error.value = err.message || 'An error occurred while fetching posts';
  }
};

onMounted(fetchPosts);
</script>

<template>
  <div class="bg-[#1c1c1c] min-h-screen">
    <div class="bg-black py-4">
      <h1 class="text-2xl font-bold text-center text-white">Solana Buildooors Blog</h1>
    </div>
    <div class="container mx-auto px-4 py-8">
      <div v-if="error" class="text-red-500 text-center">{{ error }}</div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <div v-for="post in posts" :key="post.id" class="bg-[#333335] rounded-lg shadow-md overflow-hidden">
          <div class="p-6">
            <h3 class="text-xl font-semibold text-white mb-2">{{ post.title }}</h3>
            <p class="text-[#858585] mb-4">{{ post.short }}</p>
            <div class="flex justify-between items-center">
              <span class="text-sm text-[#858585]">{{ new Date(post.createdAt).toLocaleDateString() }}</span>
              <router-link :to="`/post/${post.slug}`" class="text-[#007AFF] hover:underline">Read more</router-link>
            </div>
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