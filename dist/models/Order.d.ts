import mongoose from 'mongoose';
import { IOrder, IOrderMethods } from '@/types/order';
declare const Order: mongoose.Model<IOrder, {}, IOrderMethods, {}, mongoose.Document<unknown, {}, IOrder> & Omit<IOrder & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, keyof IOrderMethods> & IOrderMethods, mongoose.Schema<IOrder, mongoose.Model<IOrder, {}, {}, {}, mongoose.Document<unknown, {}, IOrder> & IOrder & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>, IOrderMethods, {}, {}, {}, mongoose.DefaultSchemaOptions, IOrder, mongoose.Document<unknown, {}, mongoose.FlatRecord<IOrder>> & Omit<mongoose.FlatRecord<IOrder> & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, keyof IOrderMethods> & IOrderMethods>>;
export default Order;
//# sourceMappingURL=Order.d.ts.map