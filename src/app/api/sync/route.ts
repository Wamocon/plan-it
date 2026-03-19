import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  dbAddProject, dbUpdateAnalysis, dbSetAiPending, dbSetAiFailReason, dbDeleteProject,
  dbAddTask, dbUpdateTask, dbDeleteTask,
  dbAddChatMessage, dbClearChat,
  dbTakeSnapshot,
  dbAddJiraConfig, dbUpdateJiraConfig, dbDeleteJiraConfig,
  dbAddAiConfig, dbUpdateAiConfig, dbDeleteAiConfig, dbSetActiveAiConfig,
} from '@/lib/supabase/db';

export async function POST(request: NextRequest) {
  try {
    const { action, payload } = await request.json() as { action: string; payload: Record<string, unknown> };

    switch (action) {
      case 'addProject':       await dbAddProject(payload.project as never); break;
      case 'updateAnalysis':   await dbUpdateAnalysis(payload.id as string, payload.analysis as never, payload.snapshot as never ?? null); break;
      case 'setAiPending':     await dbSetAiPending(payload.id as string, payload.pending as boolean); break;
      case 'setAiFailReason':  await dbSetAiFailReason(payload.id as string, payload.reason as 'limit' | 'error'); break;
      case 'deleteProject':    await dbDeleteProject(payload.id as string); break;
      case 'addTask':          await dbAddTask(payload.task as never, payload.projectId as string); break;
      case 'updateTask':       await dbUpdateTask(payload.id as string, payload.updates as never); break;
      case 'deleteTask':       await dbDeleteTask(payload.id as string); break;
      case 'addChatMessage':   await dbAddChatMessage(payload.message as never, payload.projectId as string); break;
      case 'clearChat':        await dbClearChat(payload.projectId as string); break;
      case 'takeSnapshot':     await dbTakeSnapshot(payload.snapshot as never, payload.projectId as string); break;
      case 'addJiraConfig':    await dbAddJiraConfig(payload.config as never); break;
      case 'updateJiraConfig': await dbUpdateJiraConfig(payload.id as string, payload.updates as never); break;
      case 'deleteJiraConfig': await dbDeleteJiraConfig(payload.id as string); break;
      case 'addAiConfig':      await dbAddAiConfig(payload.config as never); break;
      case 'updateAiConfig':   await dbUpdateAiConfig(payload.id as string, payload.updates as never); break;
      case 'deleteAiConfig':   await dbDeleteAiConfig(payload.id as string, payload.newActiveId as string | null); break;
      case 'setActiveAiConfig':await dbSetActiveAiConfig(payload.id as string); break;
      default: return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Log but don't crash – local state is source of truth
    console.error('[sync]', err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
