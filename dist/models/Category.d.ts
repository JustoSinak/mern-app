import mongoose from 'mongoose';
import { ICategory } from '@/types/product';
declare const Category: mongoose.Model<ICategory, {}, {}, {}, mongoose.Document<unknown, {}, ICategory> & ICategory & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Category;
//# sourceMappingURL=Category.d.ts.map