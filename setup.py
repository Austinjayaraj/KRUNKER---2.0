from setuptools import setup, find_packages

setup(
    name="krunker-fps-3d",
    version="1.0.0",
    description="Krunker-Style Complete 3D FPS Game Engine in Python & Panda3D",
    author="FPS Game Engineering Team",
    packages=find_packages(),
    install_requires=[
        "panda3d>=1.10.13",
        "numpy>=1.24.0",
        "pytest>=7.0.0",
    ],
    entry_points={
        "console_scripts": [
            "krunker-fps=run_krunker:main",
        ],
    },
    python_requires=">=3.9",
)
