import {asyncHandler} from "../utils/asyncHandler.js"
//import

const registerUser = asyncHandler(async(req, res)=>{
    const {username, email, fullname, intrests, password} = req.body;
    console.log(req.body);
})
export default registerUser;