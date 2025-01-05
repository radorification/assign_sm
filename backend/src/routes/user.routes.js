import { Router } from 'express';
import {registerUser, loginUser, getUser, getUserFriends, addRemoveFriend} from '../controller/user.controller.js';
import { upload } from "../middleware/multer.js";
import { verifyJWT } from "../middleware/auth.middleware.js";


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

router.route("/login").post(loginUser)
/* READ */
router.get("/:id", verifyJWT, getUser);
router.get("/:id/friends",  getUserFriends);

/* UPDATE */
router.patch("/:id/:friendId",  addRemoveFriend);




export default router;