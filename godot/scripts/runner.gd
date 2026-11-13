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

var character_visual: Node3D
var body_pivot: Node3D
var left_leg_pivot: Node3D
var right_leg_pivot: Node3D
var left_arm_pivot: Node3D
var right_arm_pivot: Node3D
var animation_player: AnimationPlayer
var collision_shape: CollisionShape3D
const ORIGINAL_CAPSULE_HEIGHT := 1.8

func _ready() -> void:
	_build_collision()
	_build_character()
	_build_animations()
	animation_player.play("run")

func _build_collision() -> void:
	collision_shape = CollisionShape3D.new()
	collision_shape.name = "PlayerCollision"
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.39
	capsule.height = ORIGINAL_CAPSULE_HEIGHT
	collision_shape.shape = capsule
	collision_shape.position.y = 0.9
	add_child(collision_shape)

func _build_character() -> void:
	character_visual = Node3D.new()
	character_visual.name = "CharacterVisual"
	add_child(character_visual)

	var jacket := _make_material(Color(0.92, 0.34, 0.12), 0.72)
	var pants := _make_material(Color(0.075, 0.12, 0.17), 0.85)
	var skin := _make_material(Color(0.72, 0.48, 0.32), 0.9)
	var shoes := _make_material(Color(0.92, 0.91, 0.82), 0.65)
	var pack := _make_material(Color(0.06, 0.2, 0.25), 0.8)

	body_pivot = Node3D.new()
	body_pivot.name = "BodyPivot"
	body_pivot.position = Vector3(0, 1.12, 0)
	character_visual.add_child(body_pivot)
	_add_capsule(body_pivot, "Jacket", 0.34, 0.92, Vector3(0, 0.02, 0), jacket)
	_add_sphere(body_pivot, "Head", 0.27, Vector3(0, 0.72, -0.015), skin)
	_add_capsule(body_pivot, "Neck", 0.105, 0.2, Vector3(0, 0.49, 0), skin)
	_add_box(body_pivot, "Backpack", Vector3(0.52, 0.58, 0.27), Vector3(0, -0.03, 0.34), pack)
	_add_box(body_pivot, "PackTop", Vector3(0.34, 0.12, 0.29), Vector3(0, 0.29, 0.34), _make_material(Color(0.95, 0.63, 0.16), 0.5))

	var pelvis := Node3D.new()
	pelvis.name = "Pelvis"
	pelvis.position = Vector3(0, 0.72, 0)
	character_visual.add_child(pelvis)
	_add_box(pelvis, "Waist", Vector3(0.55, 0.28, 0.34), Vector3.ZERO, pants)
	left_leg_pivot = _make_pivot(pelvis, "LeftLegPivot", Vector3(-0.17, -0.12, 0))
	_add_capsule(left_leg_pivot, "LeftLeg", 0.145, 0.72, Vector3(0, -0.34, 0), pants)
	_add_box(left_leg_pivot, "LeftShoe", Vector3(0.29, 0.16, 0.43), Vector3(0, -0.69, -0.075), shoes)
	right_leg_pivot = _make_pivot(pelvis, "RightLegPivot", Vector3(0.17, -0.12, 0))
	_add_capsule(right_leg_pivot, "RightLeg", 0.145, 0.72, Vector3(0, -0.34, 0), pants)
	_add_box(right_leg_pivot, "RightShoe", Vector3(0.29, 0.16, 0.43), Vector3(0, -0.69, -0.075), shoes)

	left_arm_pivot = _make_pivot(body_pivot, "LeftArmPivot", Vector3(-0.42, 0.25, 0))
	_add_capsule(left_arm_pivot, "LeftSleeve", 0.13, 0.68, Vector3(0, -0.28, 0), jacket)
	_add_sphere(left_arm_pivot, "LeftHand", 0.13, Vector3(0, -0.62, -0.01), skin)
	right_arm_pivot = _make_pivot(body_pivot, "RightArmPivot", Vector3(0.42, 0.25, 0))
	_add_capsule(right_arm_pivot, "RightSleeve", 0.13, 0.68, Vector3(0, -0.28, 0), jacket)
	_add_sphere(right_arm_pivot, "RightHand", 0.13, Vector3(0, -0.62, -0.01), skin)
	_add_box(body_pivot, "ChestStripe", Vector3(0.075, 0.56, 0.018), Vector3(0.12, 0.03, -0.176), _make_material(Color(1.0, 0.78, 0.3), 0.4))

func _make_pivot(parent: Node3D, node_name: String, pivot_position: Vector3) -> Node3D:
	var pivot := Node3D.new()
	pivot.name = node_name
	pivot.position = pivot_position
	parent.add_child(pivot)
	return pivot

func _add_capsule(parent: Node3D, node_name: String, radius: float, height: float, pos: Vector3, material: Material) -> MeshInstance3D:
	var instance := MeshInstance3D.new()
	instance.name = node_name
	var mesh := CapsuleMesh.new()
	mesh.radius = radius
	mesh.height = height
	instance.mesh = mesh
	instance.position = pos
	instance.material_override = material
	parent.add_child(instance)
	return instance

func _add_sphere(parent: Node3D, node_name: String, radius: float, pos: Vector3, material: Material) -> MeshInstance3D:
	var instance := MeshInstance3D.new()
	instance.name = node_name
	var mesh := SphereMesh.new()
	mesh.radius = radius
	mesh.height = radius * 2.0
	instance.mesh = mesh
	instance.position = pos
	instance.material_override = material
	parent.add_child(instance)
	return instance

func _add_box(parent: Node3D, node_name: String, size: Vector3, pos: Vector3, material: Material) -> MeshInstance3D:
	var instance := MeshInstance3D.new()
	instance.name = node_name
	var mesh := BoxMesh.new()
	mesh.size = size
	instance.mesh = mesh
	instance.position = pos
	instance.material_override = material
	parent.add_child(instance)
	return instance

func _make_material(color: Color, roughness: float) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = roughness
	material.metallic = 0.04
	return material

func _build_animations() -> void:
	animation_player = AnimationPlayer.new()
	animation_player.name = "AnimationPlayer"
	add_child(animation_player)
	var library := AnimationLibrary.new()
	library.add_animation("run", _create_run_animation())
	library.add_animation("jump", _create_action_animation("jump"))
	library.add_animation("slide", _create_action_animation("slide"))
	library.add_animation("hit", _create_action_animation("hit"))
	animation_player.add_animation_library("", library)

func _create_run_animation() -> Animation:
	var animation := Animation.new()
	animation.resource_name = "Run"
	animation.length = 0.56
	animation.loop_mode = Animation.LOOP_LINEAR
	_add_track(animation, "LeftLegPivot:rotation", [[0.0, Vector3(-0.72, 0, 0)], [0.14, Vector3.ZERO], [0.28, Vector3(0.72, 0, 0)], [0.42, Vector3.ZERO], [0.56, Vector3(-0.72, 0, 0)]])
	_add_track(animation, "RightLegPivot:rotation", [[0.0, Vector3(0.72, 0, 0)], [0.14, Vector3.ZERO], [0.28, Vector3(-0.72, 0, 0)], [0.42, Vector3.ZERO], [0.56, Vector3(0.72, 0, 0)]])
	_add_track(animation, "LeftArmPivot:rotation", [[0.0, Vector3(0.62, 0, -0.08)], [0.28, Vector3(-0.62, 0, -0.08)], [0.56, Vector3(0.62, 0, -0.08)]])
	_add_track(animation, "RightArmPivot:rotation", [[0.0, Vector3(-0.62, 0, 0.08)], [0.28, Vector3(0.62, 0, 0.08)], [0.56, Vector3(-0.62, 0, 0.08)]])
	_add_track(animation, "BodyPivot:position", [[0.0, Vector3(0, 1.12, 0)], [0.14, Vector3(0, 1.18, 0)], [0.28, Vector3(0, 1.12, 0)], [0.42, Vector3(0, 1.18, 0)], [0.56, Vector3(0, 1.12, 0)]])
	return animation

func _create_action_animation(action: String) -> Animation:
	var animation := Animation.new()
	animation.resource_name = action.capitalize()
	animation.length = 0.42 if action == "jump" else (0.72 if action == "slide" else 0.28)
	animation.loop_mode = Animation.LOOP_NONE
	match action:
		"jump":
			_add_track(animation, "LeftArmPivot:rotation", [[0.0, Vector3(-0.62, 0, -0.08)], [0.16, Vector3(-1.75, 0, -0.1)], [0.42, Vector3(-1.2, 0, -0.08)]])
			_add_track(animation, "RightArmPivot:rotation", [[0.0, Vector3(0.62, 0, 0.08)], [0.16, Vector3(-1.75, 0, 0.1)], [0.42, Vector3(-1.2, 0, 0.08)]])
			_add_track(animation, "BodyPivot:rotation", [[0.0, Vector3.ZERO], [0.16, Vector3(-0.18, 0, 0)], [0.42, Vector3.ZERO]])
		"slide":
			_add_track(animation, "BodyPivot:rotation", [[0.0, Vector3.ZERO], [0.18, Vector3(0, 0, -0.9)], [0.72, Vector3(0, 0, -0.9)]])
			_add_track(animation, "LeftArmPivot:rotation", [[0.0, Vector3(0.2, 0, -0.8)], [0.72, Vector3(0.2, 0, -0.8)]])
			_add_track(animation, "RightArmPivot:rotation", [[0.0, Vector3(0.2, 0, 0.8)], [0.72, Vector3(0.2, 0, 0.8)]])
		"hit":
			_add_track(animation, "BodyPivot:rotation", [[0.0, Vector3.ZERO], [0.08, Vector3(0, 0, 0.35)], [0.16, Vector3(0, 0, -0.35)], [0.28, Vector3.ZERO]])
	return animation

func _add_track(animation: Animation, property_path: String, keys: Array) -> void:
	var track := animation.add_track(Animation.TYPE_VALUE)
	animation.track_set_path(track, NodePath("CharacterVisual/" + property_path))
	for key in keys:
		animation.track_insert_key(track, float(key[0]), key[1])

func _physics_process(delta: float) -> void:
	if not active:
		return
	var was_on_floor := is_on_floor()
	target_x = float(lane - 1) * lane_width
	position.x = move_toward(position.x, target_x, lane_smoothing * delta)
	if not is_on_floor():
		velocity.y -= gravity * delta
	else:
		velocity.y = 0.0
		if not is_sliding and animation_player.current_animation != "run":
			animation_player.play("run")
	if slide_timer > 0.0:
		slide_timer -= delta
		if slide_timer <= 0.0:
			_end_slide()
	if invulnerable_timer > 0.0:
		invulnerable_timer -= delta
		character_visual.visible = int(invulnerable_timer * 12.0) % 2 == 0
	else:
		character_visual.visible = true
	move_and_slide()
	for index in range(get_slide_collision_count()):
		var collision_info := get_slide_collision(index)
		var collider := collision_info.get_collider()
		if collider is Node and collider.is_in_group("hazard") and invulnerable_timer <= 0.0:
			hit.emit()
			invulnerable_timer = 0.65
	if is_on_floor() and not was_on_floor and not is_sliding:
		animation_player.play("run")

func set_game_active(value: bool) -> void:
	active = value
	if animation_player == null:
		return
	if active:
		animation_player.play()
	else:
		animation_player.pause()

func reset_runner() -> void:
	lane = 1
	position = Vector3.ZERO
	velocity = Vector3.ZERO
	is_sliding = false
	slide_timer = 0.0
	invulnerable_timer = 0.0
	_end_slide()
	character_visual.visible = true
	animation_player.play("run")

func change_lane(direction: int) -> void:
	lane = clampi(lane + direction, 0, 2)

func jump() -> void:
	if is_on_floor() and not is_sliding:
		velocity.y = jump_velocity
		animation_player.play("jump")

func slide() -> void:
	if is_sliding or not is_on_floor():
		return
	is_sliding = true
	slide_timer = 0.72
	var capsule := collision_shape.shape as CapsuleShape3D
	capsule.height = 0.95
	collision_shape.position.y = 0.48
	character_visual.scale.y = 0.58
	animation_player.play("slide")

func _end_slide() -> void:
	is_sliding = false
	if collision_shape == null:
		return
	var capsule := collision_shape.shape as CapsuleShape3D
	capsule.height = ORIGINAL_CAPSULE_HEIGHT
	collision_shape.position.y = 0.9
	character_visual.scale.y = 1.0
	if active and animation_player != null:
		animation_player.play("run")

func flash_invulnerable() -> void:
	invulnerable_timer = 1.4
	if animation_player != null:
		animation_player.play("hit")
