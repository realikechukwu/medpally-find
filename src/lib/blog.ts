import { getCollection } from 'astro:content';

export const getPublishedPosts = async () => (await getCollection('blog', ({ data }) => !data.draft))
  .sort((a, b) => b.data.published.getTime() - a.data.published.getTime());
