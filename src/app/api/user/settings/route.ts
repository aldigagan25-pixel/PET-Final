import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { nama, email, oldPassword, newPassword } = body as {
      nama?: string;
      email?: string;
      oldPassword?: string;
      newPassword?: string;
    };

    const updateData: Record<string, string> = {};

    // Handle profile update (name / email)
    if (nama !== undefined) {
      updateData.name = nama;
    }

    if (email !== undefined) {
      // Check for email conflict with another user
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          { error: 'Email sudah digunakan oleh pengguna lain' },
          { status: 409 },
        );
      }
      updateData.email = email;
    }

    // Handle password change
    if (newPassword && oldPassword) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });

      if (!user || !user.password) {
        return NextResponse.json(
          { error: 'User tidak ditemukan' },
          { status: 404 },
        );
      }

      const passwordMatch = await bcrypt.compare(oldPassword, user.password);
      if (!passwordMatch) {
        return NextResponse.json(
          { error: 'Password lama tidak sesuai' },
          { status: 400 },
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      updateData.password = hashedPassword;
    }

    // Apply all updates in a single Prisma call
    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: updateData,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PUT /api/user/settings]', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 },
    );
  }
}
