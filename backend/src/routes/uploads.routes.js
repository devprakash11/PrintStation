import { Router } from 'express';
import multer from 'multer';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadFile, createSignedUrl } from '../services/storage.js';
const router=Router();
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:env.maxFileSize},fileFilter:(req,file,cb)=>cb(null,['application/pdf','image/jpeg','image/png'].includes(file.mimetype))});
router.post('/',requireAuth,upload.array('files',20),async(req,res,next)=>{try{if(!req.files?.length)return res.status(400).json({success:false,message:'At least one PDF, JPG or PNG file is required.'});const data=await Promise.all(req.files.map(async(file)=>{const path=await uploadFile(file,`users/${req.user.sub}`);return {file_name:file.originalname,storage_path:path,mime_type:file.mimetype,file_size:file.size,url:await createSignedUrl(path)}}));res.status(201).json({success:true,data});}catch(e){next(e);}});
export default router;
