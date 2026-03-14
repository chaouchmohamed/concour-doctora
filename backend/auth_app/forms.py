from django import forms
from django.contrib.auth.models import User
import re

class SignUpForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput)
    confirme_password = forms.CharField(widget=forms.PasswordInput, label="Confirm Password")
    class Meta:
         model = User
         fields = ['first_name','last_name','email']

    def clean_password(self):
        password = self.cleaned_data.get("password")
        if len(password) < 10:
            raise forms.ValidationError("Password must be at least 10 characters long")

        if re.search(r'[A-Z]', password) is None:
            raise forms.ValidationError("Password must contain at least one uppercase letter")

        if re.search(r'[a-z]', password) is None:
            raise forms.ValidationError("Password must contain at least one lowercase letter")

        if re.search(r'[0-9]', password) is None:
            raise forms.ValidationError("Password must contain at least one digit")

        return password
    
    def clean_email(self):
        email = self.cleaned_data.get("email")

        if User.objects.filter(email=email).exists():
            raise forms.ValidationError("This email is already used")
        
        return email

    def clean(self):
        cleaned_data  = super().clean()
        password = cleaned_data.get("password")
        confirmed_password = cleaned_data.get("confirme_password")

        if password and confirmed_password and password != confirmed_password :
            raise forms.ValidationError("Passwords are not matching")
        
        return cleaned_data
    
class SignInForm(forms.Form):
    email_address = forms.CharField(max_length=150)
    password = forms.CharField(widget=forms.PasswordInput)  
       