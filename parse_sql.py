import re

with open("public/monitoring_pekerjaan.sql", "r") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if line.startswith("INSERT INTO monitoring_pekerjaan"):
        # Replace table name
        line = line.replace("INSERT INTO monitoring_pekerjaan (id, ", "INSERT INTO outage_plans (")
        # Remove the first value which is the id
        # 'VALUES (1, ' or 'VALUES (NULL, '
        line = re.sub(r'VALUES \([^,]+, ', 'VALUES (', line)
        
        # In case the progress value is empty or the row is entirely NULLs, we can handle it
        # Actually, let's also add created_at and updated_at since Laravel models use timestamps
        # But wait, we can just insert them as is and timestamps will be NULL, which is fine.
        new_lines.append(line)

with open("temp.sql", "w") as f:
    f.writelines(new_lines)
