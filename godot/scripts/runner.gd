extends CharacterBody3D

signal hit

@export var lane_width := 2.6
@export var lane_smoothing := 15.0
@export var jump_velocity := 10.8
@export var gravity := 26.0

var lane := 1
var target_x := 0.0
var is_sliding := false
var slide_timer := 0.0
var invulnerable_timer := 0.0
var active := false
var body_visual: Node3D
var body_mesh: MeshInstance3D
var collision: CollisionShape3D
var animation_phase := 0.0

func _ready() -> void:
	position = Vector3(0, 0, 0)
	collision = CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.43
	capsule.height = 1.8
	collision.shape = capsule
	collision.position.y = 0.9
	add_child(collision)

	body_visual = Node3D.new()
	body_visual.name = "CharacterVisual"
	add_child(body_visual)
	body_mesh = MeshInstance3D.new()
	var capsule_mesh := CapsuleMesh.new()
	capsule_mesh.radius = 0.42
	capsule_mesh.height = 1.8
	body_mesh.mesh = capsule_mesh
	body_mesh.position.y = 0.9
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(0.92, 0.46, 0.22)
	mat.roughness = 0.72
	body_mesh.material_override = mat
	body_visual.add_child(body_mesh)

	var head := MeshInstance3D.new()
	var head_mesh := SphereMesh.new()
	head_mesh.radius = 0.29
	head_mesh.height = 0.58
	head.mesh = head_mesh
	head.position = Vector3(0, 1.98, 0)
	head.material_override = _make_material(Color(0.72, 0.48, 0.32))
	body_visual.add_child(head)

	var backpack := MeshInstance3D.new()
	var pack_mesh := BoxMesh.new()
	pack_mesh.size = Vector3(0.58, 0.65, 0.28)
	backpack.mesh = pack_mesh
	backpack.position = Vector3(0, 1.0, 0.36)
	backpack.material_override = _make_material(Color(0.12, 0.24, 0.3))
	body_visual.add_child(backpack)

func _make_material(color: Color) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	return material

func _physics_process(delta: float) -> void:
	if not active:
		return
	target_x = float(lane - 1) * lane_width
	position.x = move_toward(position.x, target_x, lane_smoothing * delta)
	if not is_on_floor():
		velocity.y -= gravity * delta
	else:
		velocity.y = 0.0
	if slide_timer > 0.0:
		slide_timer -= delta
		if slide_timer <= 0.0:
			_end_slide()
	if invulnerable_timer > 0.0:
		invulnerable_timer -= delta
		body_visual.visible = int(invulnerable_timer * 12.0) % 2 == 0
	else:
		body_visual.visible = true
	animation_phase += delta * 14.0
	if is_on_floor() and not is_sliding:
		body_visual.rotation.z = sin(animation_phase) * 0.045
		body_mesh.position.y = 0.9 + absf(sin(animation_phase)) * 0.055
	move_and_slide()
	for i in range(get_slide_collision_count()):
		var collision_info := get_slide_collision(i)
		var collider := collision_info.get_collider()
		if collider is Node and collider.is_in_group("hazard") and invulnerable_timer <= 0.0:
			hit.emit()
			invulnerable_timer = 0.65

func set_game_active(value: bool) -> void:
	active = value

func reset_runner() -> void:
	lane = 1
	position = Vector3.ZERO
	velocity = Vector3.ZERO
	is_sliding = false
	slide_timer = 0.0
	invulnerable_timer = 0.0
	_end_slide()
	body_visual.visible = true

func change_lane(direction: int) -> void:
	lane = clampi(lane + direction, 0, 2)

func jump() -> void:
	if is_on_floor() and not is_sliding:
		velocity.y = jump_velocity

func slide() -> void:
	if is_sliding or not is_on_floor():
		return
	is_sliding = true
	slide_timer = 0.78
	var capsule := collision.shape as CapsuleShape3D
	capsule.height = 0.9
	collision.position.y = 0.45
	body_visual.scale.y = 0.55
	body_visual.position.y = 0.0

func _end_slide() -> void:
	is_sliding = false
	if collision == null:
		return
	var capsule := collision.shape as CapsuleShape3D
	capsule.height = 1.8
	collision.position.y = 0.9
	body_visual.scale.y = 1.0
	body_visual.position.y = 0.0

func flash_invulnerable() -> void:
	invulnerable_timer = 1.4
