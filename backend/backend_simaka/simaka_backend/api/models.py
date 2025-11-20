from django.db import models

class Student(models.Model):
    STATUS_CHOICES = [
        ('hadir', 'Hadir'),
        ('terlambat', 'Terlambat'),
        ('izin', 'Izin'),
        ('sakit', 'Sakit'),
        ('tidak-hadir', 'Tidak Hadir'),
    ]

    nis = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    student_class = models.CharField(max_length=20)
    photo_code = models.CharField(max_length=10, blank=True)
    enrollment_type = models.CharField(max_length=20, default='existing')
    
    def __str__(self):
        return f"{self.name} ({self.student_class})"

# --- MODEL GURU (Tambahkan ini) ---
class Teacher(models.Model):
    name = models.CharField(max_length=100)
    subject = models.CharField(max_length=100)
    photo_code = models.CharField(max_length=10, blank=True)
    # Kita simpan jadwal sebagai JSONField agar strukturnya fleksibel & mudah dikirim ke frontend
    # Contoh isi: [{"day": "Senin", "startTime": "07:00", ...}]
    schedule = models.JSONField(default=list, blank=True)

    def __str__(self):
        return self.name

class AttendanceRecord(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=Student.STATUS_CHOICES)
    time = models.TimeField(auto_now=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('student', 'date')

class Violation(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='violations')
    date = models.DateField()
    description = models.CharField(max_length=255)
    points = models.IntegerField(default=0)

class Achievement(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='achievements')
    date = models.DateField()
    title = models.CharField(max_length=255)
    description = models.TextField()

# ... (kode model Student, Teacher, dll biarkan di atas) ...

class SchoolSettings(models.Model):
    school_name = models.CharField(max_length=100, default="SMAN 1 Jakarta (Django)")
    academic_year = models.CharField(max_length=20, default="2025/2026")
    semester = models.CharField(max_length=20, default="Ganjil")
    start_time = models.CharField(max_length=10, default="07:00")
    end_time = models.CharField(max_length=10, default="15:00")
    notifications = models.BooleanField(default=True)
    language = models.CharField(max_length=10, default="id")
    theme = models.CharField(max_length=10, default="light")

    def __str__(self):
        return "Konfigurasi Sekolah"

    # Kita override save agar hanya ada 1 baris pengaturan di database
    def save(self, *args, **kwargs):
        if not self.pk and SchoolSettings.objects.exists():
            # Jika sudah ada data, jangan buat baru, tapi update yang lama
            return SchoolSettings.objects.first().save(*args, **kwargs)
        return super(SchoolSettings, self).save(*args, **kwargs)