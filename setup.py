from setuptools import setup, find_packages

with open("requirements.txt") as f:
	install_requires = f.read().strip().split("\n")

# get version from __version__ variable in gazda/__init__.py
from gazda import __version__ as version

setup(
	name="gazda",
	version=version,
	description="Aplikacija za upravljanje nekretninama",
	author="Filip Ilic",
	author_email="filip@filipili.com",
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)
