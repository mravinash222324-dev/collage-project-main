
# Script to fix duplication in authentication/models.py
import os

file_path = 'authentication/models.py'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# We want to keep lines 0-229 (indices) which correspond to lines 1-230
# We want to skip lines 230-424 (indices) which correspond to lines 231-425
# We want to keep lines 425-end (indices) which correspond to lines 426-end

# Verify content at boundaries
print(f"Line 230 (Index 229): {lines[229]}")
print(f"Line 231 (Index 230): {lines[230]}")
print(f"Line 425 (Index 424): {lines[424]}")
print(f"Line 426 (Index 425): {lines[425]}")

new_lines = lines[:230] + lines[425:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Fixed models.py")
