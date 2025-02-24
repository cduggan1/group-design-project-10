from django import forms
from leaflet.forms.widgets import LeafletWidget
from .models import TrailSegment

class TrailSegmentInlineForm(forms.ModelForm):
    class Meta:
        model = TrailSegment
        fields = '__all__'
        widgets = {
            'segment_point': LeafletWidget(),
            'segment_line': LeafletWidget(), 
        }
