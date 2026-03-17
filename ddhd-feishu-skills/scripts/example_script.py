#!/usr/bin/env python3
"""
示例脚本文件

将此脚本放在 scripts/ 目录下，用于执行特定的确定性任务。
脚本可以直接执行，不需要加载到上下文中。

使用方式：
    python scripts/example_script.py <参数>
"""

import sys


def main():
    """主函数"""
    print("这是一个示例脚本")
    print(f"参数: {sys.argv[1:]}")


if __name__ == "__main__":
    main()
