export interface Expense {
  _id: string;
  storeName: string;
  storeImg: string;
  storeId: string;
  cost: number;
  category: string;
  description: string;
  user: string;
  houseCode: string;
  involvedUsers: string[];
  date: string;
  __v: number;
}
