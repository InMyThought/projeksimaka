from rest_framework import serializers
from .models import Student, AttendanceRecord, Teacher, SchoolSettings
from datetime import date


class TeacherSerializer(serializers.ModelSerializer):
    # Frontend minta 'photo', di DB namanya 'photo_code'. Kita mapping di sini.
    photo = serializers.CharField(source='photo_code', required=False, allow_blank=True)
    
    class Meta:
        model = Teacher
        fields = ['id', 'name', 'subject', 'photo', 'schedule']

class StudentSerializer(serializers.ModelSerializer):
    # Mapping nama field Python -> JSON Frontend
    student_class = serializers.CharField()
    photo_code = serializers.CharField()
    enrollment_type = serializers.CharField()
    
    class Meta:
        model = Student
        fields = ['id', 'nis', 'name', 'student_class', 'photo_code', 'enrollment_type']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        
        # 1. Status Absensi Hari Ini
        today = date.today()
        record = instance.attendance_records.filter(date=today).first()
        data['status'] = record.status if record else 'tidak-hadir'
        data['time'] = record.time.strftime("%H:%M") if record and record.status != 'tidak-hadir' else '-'
        
        # 2. Rename key agar sesuai Frontend (Next.js)
        data['class'] = data.pop('student_class') 
        data['photo'] = data.pop('photo_code')    
        data['type'] = data.pop('enrollment_type')
        
        # 3. Statistik Dummy (Bisa dihitung real dari DB jika perlu)
        data['attendance'] = 95 
        data['late'] = 0
        data['absent'] = 0
        data['permission'] = 0
        
        return data

class AttendanceUpdateSerializer(serializers.Serializer):
    studentId = serializers.IntegerField()
    newStatus = serializers.CharField()
    
    
# ... (kode serializer lain biarkan) ...

class SchoolSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolSettings
        fields = '__all__'