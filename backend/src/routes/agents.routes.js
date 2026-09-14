import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { pairAgent } from '../services/agentService.js';

const router=Router();
router.post('/pair',async(req,res,next)=>{try{const p=z.object({code:z.string().min(4).max(16),name:z.string().min(1).max(120),platform:z.string().max(40).default('windows')}).parse(req.body);const agent=await pairAgent(p.code,p.name,p.platform);res.status(201).json({success:true,data:agent,message:'Agent paired. Store the secret securely; it cannot be recovered.'});}catch(e){next(e);}});
router.use(requireAuth,requireRoles('admin'));
router.get('/',async(req,res,next)=>{try{const {rows}=await query('SELECT id,name,machine_name,platform,version,status,last_seen_at,registered_at,is_active FROM printer_agents ORDER BY registered_at DESC');res.json({success:true,data:rows});}catch(e){next(e);}});
router.post('/pairing-codes',async(req,res,next)=>{try{const code=Math.random().toString(36).slice(2,8).toUpperCase();await query(`INSERT INTO agent_pairings(code,created_by,expires_at) VALUES($1,$2,now()+interval '10 minutes')`,[code,req.user.id]);res.status(201).json({success:true,data:{code,expiresInSeconds:600}});}catch(e){next(e);}});
router.patch('/:id',async(req,res,next)=>{try{const p=z.object({isActive:z.boolean().optional(),name:z.string().min(1).max(120).optional()}).parse(req.body);const {rows}=await query('UPDATE printer_agents SET name=COALESCE($1,name),is_active=COALESCE($2,is_active) WHERE id=$3 RETURNING id,name,platform,status,is_active,last_seen_at',[p.name??null,p.isActive??null,req.params.id]);if(!rows[0])return res.status(404).json({success:false,message:'Agent not found.'});res.json({success:true,data:rows[0]});}catch(e){next(e);}});
export default router;
