<script setup lang="ts">
// ./packages/frontend/src/components/pages/PageBlog.vue
import { ref, onMounted } from 'vue';
import { getPaginated } from '../../services/endpoints/post';
import type { Post, PostGetPaginatedRequest } from '@code-blog/api';
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
    
    const response = await getPaginated(request);
    
    if (response.result === PostGetPaginatedResponse_Result.OK) {
      posts.value = response.posts || [];
    } else {
      error.value = "Failed to fetch posts";
    }
  } catch (err) {
    console.error('Error fetching posts:', err as Error);
    error.value = (err as Error).message || 'An error occurred while fetching posts';
  }
};

onMounted(fetchPosts);
</script>

<template>
  <section class="bg-[#1c1c1c] min-h-screen py-8">
    <div class="container mx-auto px-4">
      <div class="text-center mb-12">
        <h2 class="text-3xl font-bold text-white mb-4">Solana Buildooors Blog</h2>
        <p class="text-xl text-gray-300">Building on Solana since Genesis. Make a Living On-Chain.</p>
      </div>
      <div v-if="error" class="text-red-500 text-center">{{ error }}</div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <article v-for="post in posts" :key="post.id" class="bg-[#333335] rounded-lg shadow-md overflow-hidden">
          <router-link :to="`/p/${post.slug}`">
            <img class="w-full h-48 object-cover" src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/blog/office-laptops.png" alt="blog image">
          </router-link>
          <div class="p-6">
            <span class="text-xs font-medium text-blue-400 uppercase">Article</span>
            <h2 class="text-xl font-bold text-white mt-2 mb-4">
              <router-link :to="`/p/${post.slug}`">{{ post.title }}</router-link>
            </h2>
            <p class="text-gray-300 mb-4">{{ post.short }}</p>
            <div class="flex items-center">
              <img class="w-10 h-10 rounded-full mr-4" src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/avatars/jese-leos.png" alt="Author avatar">
              <div>
                <div class="font-medium text-white">Dev</div>
                <div class="text-sm text-gray-400">{{ new Date(post.createdAt).toLocaleDateString() }}</div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

body {
  font-family: 'Inter', sans-serif;
  background-color: #1c1c1c;
  color: white;
}

/* Add any additional global styles here */
</style>