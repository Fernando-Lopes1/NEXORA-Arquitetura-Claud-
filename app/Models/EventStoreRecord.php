<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventStoreRecord extends Model
{
    protected $table = 'event_store';

    public $timestamps = false;

    protected $fillable = [
        'event_id',
        'aggregate_type',
        'aggregate_id',
        'event_type',
        'version',
        'payload',
        'metadata',
        'created_at',
    ];

    protected $casts = [
        'version' => 'integer',
        'payload' => 'array',
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];
}
