import { Router } from 'express';
import registerUser from '../controller/user.controller.js';
import { upload } from "../middleware/multer.js";
//import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router();
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    }
  ]),
  registerUser
);



router.route('/register').post(registerUser);

export default router;