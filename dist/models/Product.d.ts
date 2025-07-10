import mongoose from 'mongoose';
import { IProduct, IProductMethods } from '@/types/product';
declare const Product: mongoose.Model<IProduct, {}, IProductMethods, {}, mongoose.Document<unknown, {}, IProduct> & Omit<IProduct & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, keyof IProductMethods> & IProductMethods, mongoose.Schema<IProduct, mongoose.Model<IProduct, {}, {}, {}, mongoose.Document<unknown, {}, IProduct> & IProduct & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>, IProductMethods, {}, {}, {}, mongoose.DefaultSchemaOptions, IProduct, mongoose.Document<unknown, {}, mongoose.FlatRecord<IProduct>> & Omit<mongoose.FlatRecord<IProduct> & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, keyof IProductMethods> & IProductMethods>>;
export default Product;
//# sourceMappingURL=Product.d.ts.map