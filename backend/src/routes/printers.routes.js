import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();
const printerInput = z.object({ name: z.string().min(1).max(120), model: z.string().max(160).optional().default(''), agentId: z.string().uuid(), systemPrinterName: z.string().min(1).max(255), location: z.string().max(255).optional().default(''), connectionType: z.enum(['usb','wifi','ethernet','bluetooth','other']).optional().default('other'), capabilities: z.record(z.string(), z.any()).optional().default({}), isEnabled: z.boolean().optional().default(true) });

router.use(requireAuth, requireRoles('admin','staff','operator'));
router.get('/', async (req,res,next)=>{ try { const {rows}=await query('SELECT * FROM printers ORDER BY created_at DESC'); res.json({success:true,data:rows}); } catch(e){next(e);} });
router.get('/:id', async(req,res,next)=>{try{const {rows}=await query('SELECT * FROM printers WHERE id=$1',[req.params.id]); if(!rows[0]) return res.status(404).json({success:false,message:'Printer not found.'}); res.json({success:true,data:rows[0]});}catch(e){next(e);}});
router.post('/', async(req,res,next)=>{try{const p=printerInput.parse(req.body); const {rows}=await query(`INSERT INTO printers (name,model,agent_id,system_printer_name,location,connection_type,capabilities,status,is_enabled) VALUES ($1,$2,$3,$4,$5,$6,$7,'offline',$8) RETURNING *`,[p.name,p.model,p.agentId,p.systemPrinterName,p.location,p.connectionType,JSON.stringify(p.capabilities),p.isEnabled]); res.status(201).json({success:true,data:rows[0]});}catch(e){next(e);}});
router.patch('/:id', async(req,res,next)=>{try{const allowed=z.object({name:z.string().min(1).max(120).optional(),model:z.string().max(160).optional(),location:z.string().max(255).optional(),capabilities:z.record(z.string(),z.any()).optional(),isEnabled:z.boolean().optional()}).parse(req.body); const fields=[]; const values=[]; for(const [key,value] of Object.entries(allowed)){if(value===undefined)continue; fields.push(`${({name:'name',model:'model',location:'location',capabilities:'capabilities',isEnabled:'is_enabled'})[key]}=$${values.length+1}`); values.push(key==='capabilities'?JSON.stringify(value):value);} if(!fields.length)return res.status(400).json({success:false,message:'No changes supplied.'}); values.push(req.params.id); const {rows}=await query(`UPDATE printers SET ${fields.join(',')},updated_at=now() WHERE id=$${values.length} RETURNING *`,values); if(!rows[0])return res.status(404).json({success:false,message:'Printer not found.'}); res.json({success:true,data:rows[0]});}catch(e){next(e);}});
router.delete('/:id', async(req,res,next)=>{try{const r=await query('DELETE FROM printers WHERE id=$1',[req.params.id]); if(!r.rowCount)return res.status(404).json({success:false,message:'Printer not found.'}); res.json({success:true});}catch(e){next(e);}});
export default router;
