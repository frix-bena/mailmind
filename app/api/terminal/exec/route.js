import { NextResponse } from 'next/server';
import { exec } from 'child_process';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { command } = body;

    if (!command) {
      return NextResponse.json(
        { error: 'Command string is required.' },
        { status: 400 }
      );
    }

    return new Promise((resolve) => {
      exec(command, { cwd: process.cwd(), maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
        resolve(
          NextResponse.json({
            success: !error,
            exitCode: error ? error.code || 1 : 0,
            stdout: stdout || '',
            stderr: stderr || '',
            error: error ? error.message : null
          })
        );
      });
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
