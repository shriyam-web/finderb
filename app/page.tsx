import HomeClient from '@/components/HomeClient';
import { getFeaturedBusinesses } from '@/app/actions/business';
import { getCategories } from '@/app/actions/category';
import { getMovies } from '@/app/actions/movie';
import { getTouristPlaces } from '@/app/actions/touristPlace';
import { getBlogs } from '@/app/actions/blog';

export default async function Home() {
  const [bizResult, catResult, movieResult, touristResult, blogResult] = await Promise.all([
    getFeaturedBusinesses(),
    getCategories(),
    getMovies(),
    getTouristPlaces(),
    getBlogs()
  ]);

  const initialData = {
    businesses: bizResult.success ? bizResult.businesses : [],
    categories: catResult.success ? catResult.categories : [],
    movies: movieResult.success ? movieResult.movies : [],
    touristPlaces: touristResult.success ? touristResult.touristPlaces : [],
    blogs: blogResult.success ? blogResult.blogs : []
  };

  return <HomeClient initialData={initialData} />;
}
