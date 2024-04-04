






import { useEffect, useState } from "react";
import { Transaction, columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import accounts from "@/api/accounts";

const PortfolioPage = () => {
  const [data, setData] = useState<Transaction[]>([]);

  useEffect(()=>{
    const fetchTransactions= async()=>{
       const resData = await accounts.getTransactions()
       setData(resData.data)
       console.log(data)
       return resData
    }
    fetchTransactions()
  },[])
  return (
    <div>
      <h1>Portfolio Page</h1>
      <DataTable columns={columns} data={data} />
    </div>
  );
};

export default PortfolioPage;
