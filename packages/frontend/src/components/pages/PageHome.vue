<script setup lang="ts">
import SectionHeader from '../sections/SectionHeader.vue';
import GenericLayout from '../layouts/GenericLayout.vue';
import CodeLoginButton from '../elements/CodeLoginButton.vue';

import { ClientOnly } from '../ClientOnly';
import { useConfig } from '../../config';
import { createLoginIntent } from '../../services/helpers/login';
import { isLoggedIn } from '../../state/account';

import { ref, onMounted } from 'vue';
import { getAllPosts } from '../../services/endpoints/data';
import type { DataPost, DataGetAllPostsRequest, DataGetAllPostsResponse } from '@code-pennypost/api';

const config = useConfig();
const posts = ref<DataPost[]>([]);
const error = ref<string | null>(null);

const fetchPosts = async () => {
  try {
    console.log("Fetching posts...");
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
    error.value = err.message;
  }
};

onMounted(fetchPosts);
</script>

<template>
  <GenericLayout>
    <template #header>
        <SectionHeader />
    </template>

    <template #main>
        <div class="max-w-2xl">
            <div class="text-center max-w-xs mx-auto sm:max-w-full">
                <h1 class="text-5xl font-bold tracking-tight text-[#07204E] mt-9">
                    Monetize your content instantly.
                </h1>
                <p class="mt-10 text-base text-[#07204E]">
                    Effortlessly add a ${{ config.defaultPrice }} micropaywall to start earning from every post.
                </p>

                <div v-if="isLoggedIn()">
                    <router-link to="/write" 
                        class="inline-flex px-5 mt-10 justify-center
                        rounded-md bg-[#34AA4E] no-underline py-4 text-sm font-semibold
                        text-white shadow-sm focus-visible:outline
                        focus-visible:outline-2 focus-visible:outline-offset-2
                        focus-visible:outline-indigo-600 sm:col-start-2">
                            Write Your Own Pennypost</router-link>
                </div>
                <div v-else>
                    <ClientOnly>
                        <CodeLoginButton class="mt-10"
                            :create-intent="createLoginIntent"
                            success-url="/redirect/login/{{INTENT_ID}}" 
                        />
                    </ClientOnly>
                    <p class="mt-14 text-sm text-[#07204E]">
                        Don't have the Code App yet? <a href="https://getcode.com/download" class="underline">Download It Now</a>
                    </p>
                </div>
            </div>
        </div>

        <!-- Add the new blog posts grid -->
        <div class="mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 class="text-3xl font-bold text-[#07204E] mb-8">Latest Posts</h2>
          <div v-if="error">{{ error }}</div>
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
  </GenericLayout>
</template>