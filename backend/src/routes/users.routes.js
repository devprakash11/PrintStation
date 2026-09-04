import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
const router = Router();
router.use(requireAuth, requireRole('admin'));
const idSchema = z.string().uuid();

router.get('/', async (req,res,next) => { try { const r=await query(`SELECT id,name,email,role,status,last_login_at,created_at FROM users ORDER BY created_at DESC`); res.json({success:true,data:r.rows}); } catch(e){next(e);} });
router.post('/', async (req,res,next) => { try { const body=z.object({name:z.string().min(2).max(100),email:z.string().email(),role:z.enum(['admin','staff','operator']).default('staff')}).parse(req.body); const r=await query(`INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id,name,email,role,status,created_at`,[body.name,body.email.toLowerCase(), 'TEMPORARY_PASSWORD_CHANGE_REQUIRED',body.role]); res.status(201).json({success:true,data:r.rows[0]}); } catch(e){next(e);} });
router.patch('/:id', async(req,res,next)=>{try{const id=idSchema.parse(req.params.id);const body=z.object({name:z.string().min(2).max(100).optional(),role:z.enum(['admin','staff','operator']).optional(),status:z.enum(['active','suspended']).optional()}).parse(req.body);const fields=[];const vals=[];for(const [k,v] of Object.entries(body)){fields.push(`${k}=$${vals.length+1}`);vals.push(v);}if(!fields.length)return res.status(400).json({success:false,message:'No changes supplied.'});vals.push(id);const r=await query(`UPDATE users SET ${fields.join(',')} WHERE id=$${vals.length} RETURNING id,name,email,role,status,created_at`,vals);res.json({success:true,data:r.rows[0]});}catch(e){next(e);}});
router.delete('/:id',async(req,res,next)=>{try{const id=idSchema.parse(req.params.id);if(id===req.user.sub)return res.status(400).json({success:false,message:'You cannot delete your own account.'});await query('DELETE FROM users WHERE id=$1',[id]);res.status(204).end();}catch(e){next(e);}});
export default router;
