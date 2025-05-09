import { getCompanies } from '@/contexts/api';
import Test from './test';

const Home = async () => {
  const result = await getCompanies();

  console.log(result)

  return (
    <div>
      <h1>Total: {result?.data?.length}</h1>
      <Test />
    </div>
  );
};

export default Home;
