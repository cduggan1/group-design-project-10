# your_app/management/commands/generate_trail_segments.py

import datetime
from django.core.management.base import BaseCommand
from django.contrib.gis.geos import LineString
from ...models import Trail, TrailSegment  # Adjust the import as needed

class Command(BaseCommand):
    help = 'Generate trail segments for each Trail based on an estimated average speed.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--trail',
            type=int,
            help='Process only a specific Trail by its primary key'
        )

    def handle(self, *args, **options):
        trail_id = options.get('trail')
        if trail_id:
            trails = Trail.objects.filter(pk=trail_id)
        else:
            trails = Trail.objects.all()

        total_trails = trails.count()
        self.stdout.write(f"Processing {total_trails} trails...")

        processed_count = 0
        for trail in trails:
            processed_count += 1
            self.stdout.write(
                f"[{processed_count}/{total_trails}] Processing Trail {trail.id} - {trail.name or 'Unnamed'}"
            )

            # Delete existing segments for this trail if needed
            TrailSegment.objects.filter(trail=trail).delete()

            segments = self.compute_trail_segments(trail)
            if segments:
                TrailSegment.objects.bulk_create(segments)
                self.stdout.write(
                    self.style.SUCCESS(f"  Generated {len(segments)} segments for Trail {trail.id}.")
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f"  Trail {trail.id} has an invalid length; skipping segment generation.")
                )

        self.stdout.write(self.style.SUCCESS("All trails processed successfully."))

    def compute_trail_segments(self, trail):
        """
        Computes trail segments using a mapping of activity to speed (in km/h).
        """
        # Mapping of activity to average speed (km/h)
        activity_speed = {
            'Walking': 5,
            'Snorkelling': 7,
            'Horse Sport': 10,
            'Cycling': 15,
            'Canoeing/Kayaking/Paddling': 5,
        }
        pace = activity_speed.get(trail.activity, 5)

        total_length = trail.length_km
        if total_length is None or total_length <= 0:
            return []  # Cannot compute segments without a valid length

        # Calculate the estimated number of whole hours for the trail journey.
        total_hours = int(total_length / pace)
        segments = []

        # Use the trail's route (a LineString) to interpolate points along the route.
        route = trail.route
        # Get the starting point (at distance 0)
        previous_point = route.interpolate(0)

        for hour in range(total_hours + 1):
            # Compute the distance (in km) traveled by the given hour.
            traveled_distance = hour * pace
            # Determine the fraction of the total_length that has been covered.
            fraction = traveled_distance / total_length
            if fraction > 1:
                fraction = 1

            # Multiply by the actual route length to get the absolute distance along the line.
            absolute_distance = fraction * route.length
            current_point = route.interpolate(absolute_distance)
            segment_line = LineString([previous_point, current_point])

            segment = TrailSegment(
                trail=trail,
                segment_index=hour + 1,
                start_time_offset=datetime.timedelta(hours=hour),
                start_distance_km=traveled_distance,
                end_distance_km=min((hour + 1) * pace, total_length),
                segment_point=current_point,
                segment_line=segment_line
            )
            segments.append(segment)
            previous_point = current_point

        return segments
