import mongoose from 'mongoose';
import { ICart, ICartMethods } from '@/types/order';
declare const Cart: mongoose.Model<ICart, {}, ICartMethods, {}, mongoose.Document<unknown, {}, ICart> & Omit<ICart & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, keyof ICartMethods> & ICartMethods, mongoose.Schema<ICart, mongoose.Model<ICart, {}, {}, {}, mongoose.Document<unknown, {}, ICart> & ICart & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>, ICartMethods, {}, {}, {}, mongoose.DefaultSchemaOptions, ICart, mongoose.Document<unknown, {}, mongoose.FlatRecord<ICart>> & Omit<mongoose.FlatRecord<ICart> & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, keyof ICartMethods> & ICartMethods>>;
export default Cart;
//# sourceMappingURL=Cart.d.ts.map