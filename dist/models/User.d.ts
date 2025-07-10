import mongoose from 'mongoose';
import { IUser, IUserMethods } from '@/types/user';
declare const User: mongoose.Model<IUser, {}, IUserMethods, {}, mongoose.Document<unknown, {}, IUser> & Omit<IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, keyof IUserMethods> & IUserMethods, mongoose.Schema<IUser, mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>, IUserMethods, {}, {}, {}, mongoose.DefaultSchemaOptions, IUser, mongoose.Document<unknown, {}, mongoose.FlatRecord<IUser>> & Omit<mongoose.FlatRecord<IUser> & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, keyof IUserMethods> & IUserMethods>>;
export default User;
//# sourceMappingURL=User.d.ts.map