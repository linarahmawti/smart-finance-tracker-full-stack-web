import { NextResponse } from 'next/server';
import {
  createCategoryServer,
  createPocketServer,
  createTransactionServer,
  createTransferServer,
  deleteCategoryServer,
  deletePocketServer,
  deleteTransactionServer,
  deleteTransferServer,
  fetchFinanceDataForUser,
  requireFinanceUser,
  updateCategoryServer,
  updatePocketServer,
  updateTransactionServer,
} from '@/lib/server/finance';

export async function GET() {
  try {
    const { user } = await requireFinanceUser();
    const data = await fetchFinanceDataForUser(user.id);
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0],
      },
      ...data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load finance data' },
      { status: 401 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireFinanceUser();
    const { action, payload } = await request.json();

    switch (action) {
      case 'create-pocket':
        return NextResponse.json(await createPocketServer(user.id, payload));
      case 'create-category':
        return NextResponse.json(await createCategoryServer(user.id, payload));
      case 'create-income':
        return NextResponse.json(await createTransactionServer(user.id, { ...payload, type: 'income' }));
      case 'create-expense':
        return NextResponse.json(await createTransactionServer(user.id, { ...payload, type: 'expense' }));
      case 'create-transfer':
        return NextResponse.json(await createTransferServer(user.id, payload));
      default:
        return NextResponse.json({ error: 'Action not supported' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { user } = await requireFinanceUser();
    const { action, id, payload } = await request.json();

    switch (action) {
      case 'update-pocket':
        return NextResponse.json(await updatePocketServer(user.id, id, payload));
      case 'update-category':
        return NextResponse.json(await updateCategoryServer(user.id, id, payload));
      case 'update-transaction':
        return NextResponse.json(await updateTransactionServer(user.id, id, payload));
      default:
        return NextResponse.json({ error: 'Action not supported' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update data' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { user } = await requireFinanceUser();
    const { action, id } = await request.json();

    switch (action) {
      case 'delete-pocket':
        return NextResponse.json(await deletePocketServer(user.id, id));
      case 'delete-category':
        return NextResponse.json(await deleteCategoryServer(user.id, id));
      case 'delete-transaction':
        return NextResponse.json(await deleteTransactionServer(user.id, id));
      case 'delete-transfer':
        return NextResponse.json(await deleteTransferServer(user.id, id));
      default:
        return NextResponse.json({ error: 'Action not supported' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete data' },
      { status: 400 }
    );
  }
}
