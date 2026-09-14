import { Router } from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import { env } from '../config/env.js';

const router=Router();
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:env.maxFileSizeMb*1024*1024}});
router.post('/',upload.single('file'),async(req,res)=>{if(!req.file)return res.status(400).json({success:false,message:'File is required.'});const id=crypto.randomUUID();const path=`pending/${id}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g,'_')}`;res.status(201).json({success:true,data:{storagePath:path,fileName:req.file.originalname,mimeType:req.file.mimetype,fileSize:req.file.size,message:'File accepted. Connect this endpoint to object storage before production printing.'}});});
export default router;
