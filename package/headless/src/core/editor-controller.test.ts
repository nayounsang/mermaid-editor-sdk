import { describe, expect, it, vi } from 'vitest';
import { EditorController } from './editor-controller';

describe('EditorController', () => {
  it('forwards only changed non-host source updates while started', () => {
    const onChange = vi.fn();
    const controller = new EditorController('flowchart TD\n  A-->B', onChange);
    controller.start();
    expect(controller.setSource('flowchart TD\n  A-->C')).toBe(true);
    expect(onChange).toHaveBeenCalledWith('flowchart TD\n  A-->C');
    expect(controller.setSource('flowchart TD\n  A-->C')).toBe(false);
    controller.setHostValue('flowchart TD\n  X-->Y');
    expect(onChange).toHaveBeenCalledTimes(1);
    controller.stop();
    controller.setSource('flowchart TD\n  X-->Z');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('supports callback replacement, repeated start and undo/redo delegation', () => {
    const first = vi.fn();
    const second = vi.fn();
    const controller = new EditorController('flowchart TD\n  A-->B', first);
    controller.start();
    controller.start();
    controller.setOnChange(second);
    controller.setSource('flowchart TD\n  A-->C');
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(controller.undo()).toBe('flowchart TD\n  A-->B');
    expect(controller.redo()).toBe('flowchart TD\n  A-->C');
    controller.setOnChange();
    controller.setSource('flowchart TD\n  A-->D');
    expect(second).toHaveBeenCalledTimes(3);
  });
});
