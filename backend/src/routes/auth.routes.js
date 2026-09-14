import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { requireAuth, signUser } from '../middleware/auth.js';

const router=Router();
const credentials=z.object({email:z.string().email(),password:z.string().min(8).max(128)});
router.post('/login',async(req,res,next)=>{try{const p=credentials.parse(req.body);const {rows}=await query('SELECT id,name,email,password_hash,role,status FROM users WHERE lower(email)=lower($1)',[p.email]);const user=rows[0];if(!user||user.status!=='active'||!(await bcrypt.compare(p.password,user.password_hash)))return res.status(401).json({success:false,message:'Invalid email or password.'});await query('UPDATE users SET last_login_at=now(),updated_at=now() WHERE id=$1',[user.id]);const {password_hash,...safe}=user;res.json({success:true,data:{token:signUser(safe),user:safe}});}catch(e){next(e);}});
router.get('/me',requireAuth,(req,res)=>res.json({success:true,data:req.user}));
export default router;
