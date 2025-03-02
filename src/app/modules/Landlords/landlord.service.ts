import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import { Listing } from "./landlord.model";
import { IListing } from "./landlord.interface";
import { User } from "../User/user.model";
import { IImageFiles } from "../../interface/IImageFile";
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";

const CreateListingIntoDb = async (
  payload: IListing,
  houseImages: IImageFiles,
) => {
  const { images } = houseImages;
  if (!images || images.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, "House images are required.");
  }

  const uploadedImages = await Promise.all(
    images.map(async image => {
      const uploadResult = await sendImageToCloudinary(
        image.originalname,
        image.path,
      );
      return uploadResult;
    }),
  );
  const secure_url = uploadedImages.map((img: any) => img.secure_url);
  payload.images = secure_url;

  const id = payload?.landlordId;

  const isExistUser = await User.findOne({ _id: id });
  if (!isExistUser) {
    throw new AppError(httpStatus.NOT_FOUND, "Landlord not found!");
  }

  if (isExistUser?.role !== "landlord") {
    throw new AppError(httpStatus.BAD_REQUEST, "Tenant can't create listing");
  }

  const result = await Listing.create(payload);
  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, "User created failed");
  }
  return result;
};
const GetAllListingFromDb = async () => {
  const result = await Listing.find();
  return result;
};

const UpdateListingsIntoDb = async (id: string, payload: Partial<IListing>) => {
  const result = await Listing.updateOne({ _id: id }, payload, {
    runValidators: true,
  });
  if (result?.modifiedCount === 0) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Listings not found or no changes made",
    );
  }
  return await Listing.findById(id);
};
const DeleteListingsFromDb = async (id: string) => {
  const result = await Listing.deleteOne({ _id: id });
  if (result?.deletedCount === 0) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Listing not found or no changes made",
    );
  }
  return null;
};

export const LandlordServices = {
  CreateListingIntoDb,
  GetAllListingFromDb,
  UpdateListingsIntoDb,
  DeleteListingsFromDb,
};
